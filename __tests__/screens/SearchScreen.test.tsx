/**
 * Component tests for app/(tabs)/search.tsx — Search screen
 *
 * Covers:
 *   - Renders the search input
 *   - Shows idle hint when query is empty
 *   - Displays results list when query returns results
 *   - Displays "no results" state when isEmpty === true
 *   - Shows loading indicator while searching
 *   - Navigates to dhikr/[id] when a result card is pressed
 *   - Calls addFavorite / removeFavorite when the favorite toggle is pressed
 *
 * Requirements: 11.1–11.4
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import SearchScreen from '../../app/(tabs)/search';
import type { Dhikr } from '../../src/types/content';

// ── i18n test instance ────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        search: {
          placeholder: 'Search adhkar…',
          noResultsTitle: 'No Results Found',
          noResultsMessage: 'No adhkar matched "{{query}}". Try a different keyword.',
          emptyQueryHint: 'Type to search Arabic text, transliteration, or translation.',
        },
        authenticityGrade: {
          sahih: 'Sahih',
          hasan: 'Hasan',
        },
        dhikr: {
          addToFavorites: 'Add to favorites',
          removeFromFavorites: 'Remove from favorites',
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
}));

// useSearch hook
const mockUseSearch = jest.fn();
jest.mock('../../src/hooks/useSearch', () => ({
  useSearch: (query: string) => mockUseSearch(query),
}));

// favoritesStore
const mockAddFavorite = jest.fn();
const mockRemoveFavorite = jest.fn();
const mockIsFavorite = jest.fn();
const mockUseFavoritesStore = jest.fn();
jest.mock('../../src/store/favoritesStore', () => ({
  useFavoritesStore: (
    selector: (s: {
      addFavorite: (id: number) => void;
      removeFavorite: (id: number) => void;
      isFavorite: (id: number) => boolean;
    }) => unknown,
  ) => mockUseFavoritesStore(selector),
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

const mockDhikrList: Dhikr[] = [makeDhikr(1), makeDhikr(2), makeDhikr(3)];

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupDefaults({
  results = [] as Dhikr[],
  isLoading = false,
  isEmpty = false,
  favoriteIds = new Set<number>(),
}: {
  results?: Dhikr[];
  isLoading?: boolean;
  isEmpty?: boolean;
  favoriteIds?: Set<number>;
} = {}) {
  mockUseSearch.mockReturnValue({ results, isLoading, isEmpty });

  mockIsFavorite.mockImplementation((id: number) => favoriteIds.has(id));

  mockUseFavoritesStore.mockImplementation(
    (
      selector: (s: {
        addFavorite: (id: number) => void;
        removeFavorite: (id: number) => void;
        isFavorite: (id: number) => boolean;
      }) => unknown,
    ) =>
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
      <SearchScreen />
    </I18nextProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('SearchScreen', () => {
  // ── Search input ───────────────────────────────────────────────────────────

  describe('Search input', () => {
    it('renders the search input', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('search-input')).toBeTruthy();
    });

    it('renders the search input with the correct placeholder', () => {
      const { getByPlaceholderText } = renderScreen();
      expect(getByPlaceholderText('Search adhkar…')).toBeTruthy();
    });

    it('updates the query when text is entered', () => {
      const { getByTestId } = renderScreen();
      const input = getByTestId('search-input');
      fireEvent.changeText(input, 'subhan');
      expect(input.props.value).toBe('subhan');
    });
  });

  // ── Idle state (empty query) ───────────────────────────────────────────────

  describe('Idle state', () => {
    it('shows the idle hint when query is empty', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: false });
      const { getByTestId } = renderScreen();
      expect(getByTestId('search-idle')).toBeTruthy();
    });

    it('renders the idle hint text', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: false });
      const { getByText } = renderScreen();
      expect(
        getByText('Type to search Arabic text, transliteration, or translation.'),
      ).toBeTruthy();
    });

    it('does not show the results list in idle state', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: false });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('search-results-list')).toBeNull();
    });

    it('does not show the no-results state in idle state', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: false });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('search-no-results')).toBeNull();
    });
  });

  // ── Results list ───────────────────────────────────────────────────────────

  describe('Results list', () => {
    it('displays the results list when query returns results', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId } = renderScreen();
      // Simulate a non-empty query so the results list renders
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      expect(getByTestId('search-results-list')).toBeTruthy();
    });

    it('renders a DhikrCard for each result', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId, getAllByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      const cards = getAllByTestId('dhikr-card');
      expect(cards).toHaveLength(mockDhikrList.length);
    });

    it('renders the Arabic text of each result', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId, getByText } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      expect(getByText('سُبْحَانَ اللَّهِ 1')).toBeTruthy();
      expect(getByText('سُبْحَانَ اللَّهِ 2')).toBeTruthy();
      expect(getByText('سُبْحَانَ اللَّهِ 3')).toBeTruthy();
    });

    it('does not show the idle hint when results are displayed', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      expect(queryByTestId('search-idle')).toBeNull();
    });

    it('does not show the no-results state when results are displayed', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      expect(queryByTestId('search-no-results')).toBeNull();
    });
  });

  // ── No results state ───────────────────────────────────────────────────────

  describe('No results state', () => {
    it('displays the no-results state when isEmpty is true', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: true });
      const { getByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'xyz');
      expect(getByTestId('search-no-results')).toBeTruthy();
    });

    it('renders the no-results title', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: true });
      const { getByTestId, getByText } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'xyz');
      expect(getByText('No Results Found')).toBeTruthy();
    });

    it('renders the no-results message', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: true });
      const { getByTestId, getByText } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'xyz');
      expect(getByText('No adhkar matched "xyz". Try a different keyword.')).toBeTruthy();
    });

    it('does not show the results list in no-results state', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: true });
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'xyz');
      expect(queryByTestId('search-results-list')).toBeNull();
    });

    it('does not show the idle hint in no-results state', () => {
      setupDefaults({ results: [], isLoading: false, isEmpty: true });
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'xyz');
      expect(queryByTestId('search-idle')).toBeNull();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while searching', () => {
      setupDefaults({ results: [], isLoading: true, isEmpty: false });
      const { getByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      expect(getByTestId('search-loading')).toBeTruthy();
    });

    it('does not show the results list while loading', () => {
      setupDefaults({ results: [], isLoading: true, isEmpty: false });
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      expect(queryByTestId('search-results-list')).toBeNull();
    });

    it('does not show the no-results state while loading', () => {
      setupDefaults({ results: [], isLoading: true, isEmpty: false });
      const { getByTestId, queryByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      expect(queryByTestId('search-no-results')).toBeNull();
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('navigates to dhikr/[id] when a result card is pressed', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId, getAllByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      const cards = getAllByTestId('dhikr-card');
      fireEvent.press(cards[0]);
      expect(mockPush).toHaveBeenCalledWith('/dhikr/1');
    });

    it('navigates to the correct dhikr id for the second card', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId, getAllByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      const cards = getAllByTestId('dhikr-card');
      fireEvent.press(cards[1]);
      expect(mockPush).toHaveBeenCalledWith('/dhikr/2');
    });

    it('navigates to the correct dhikr id for the third card', () => {
      setupDefaults({ results: mockDhikrList, isLoading: false, isEmpty: false });
      const { getByTestId, getAllByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      const cards = getAllByTestId('dhikr-card');
      fireEvent.press(cards[2]);
      expect(mockPush).toHaveBeenCalledWith('/dhikr/3');
    });
  });

  // ── Favorite toggle ────────────────────────────────────────────────────────

  describe('Favorite toggle', () => {
    it('calls addFavorite when toggling a non-favorited dhikr', () => {
      setupDefaults({
        results: mockDhikrList,
        isLoading: false,
        isEmpty: false,
        favoriteIds: new Set(),
      });
      const { getByTestId, getAllByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      const toggles = getAllByTestId('dhikr-card-favorite');
      fireEvent.press(toggles[0]);
      expect(mockAddFavorite).toHaveBeenCalledWith(1);
    });

    it('calls removeFavorite when toggling an already-favorited dhikr', () => {
      setupDefaults({
        results: mockDhikrList,
        isLoading: false,
        isEmpty: false,
        favoriteIds: new Set([1, 2, 3]),
      });
      const { getByTestId, getAllByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      const toggles = getAllByTestId('dhikr-card-favorite');
      fireEvent.press(toggles[0]);
      expect(mockRemoveFavorite).toHaveBeenCalledWith(1);
    });

    it('does not call onPress when the favorite toggle is pressed', () => {
      setupDefaults({
        results: mockDhikrList,
        isLoading: false,
        isEmpty: false,
        favoriteIds: new Set(),
      });
      const { getByTestId, getAllByTestId } = renderScreen();
      fireEvent.changeText(getByTestId('search-input'), 'subhan');
      const toggles = getAllByTestId('dhikr-card-favorite');
      fireEvent.press(toggles[0]);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
