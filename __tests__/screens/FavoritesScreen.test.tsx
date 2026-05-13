/**
 * Component tests for app/(tabs)/favorites.tsx — Favorites screen
 *
 * Covers:
 *   - Renders the favorites list when favorites exist
 *   - Renders a DhikrCard for each favorited dhikr
 *   - Renders the empty state when no favorites exist
 *   - Navigates to dhikr/[id] when a DhikrCard is pressed
 *   - Calls removeFavorite when the favorite toggle is pressed
 *   - Removing a favorite updates the list immediately (card disappears)
 *   - Shows loading indicator while favorites are loading
 *
 * Requirements: 10.1–10.5
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import FavoritesScreen from '../../app/(tabs)/favorites';
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
}));

// favoritesStore
const mockRemoveFavorite = jest.fn();
const mockIsFavorite = jest.fn();
const mockUseFavoritesStore = jest.fn();
jest.mock('../../src/store/favoritesStore', () => ({
  useFavoritesStore: (
    selector: (s: {
      dhikrIds: Set<number>;
      removeFavorite: (id: number) => void;
      isFavorite: (id: number) => boolean;
    }) => unknown,
  ) => mockUseFavoritesStore(selector),
}));

// settingsStore
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (s: { language: string }) => unknown) =>
    selector({ language: 'en' }),
}));

// DB client
const mockOpenContentDb = jest.fn();
jest.mock('../../src/db/client', () => ({
  openContentDb: () => mockOpenContentDb(),
  openUserDb: jest.fn(),
}));

// DB queries
const mockGetDhikrById = jest.fn();
jest.mock('../../src/db/queries', () => ({
  getDhikrById: (
    db: unknown,
    id: number,
    locale: string,
  ) => mockGetDhikrById(db, id, locale),
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
  favoriteIds = new Set<number>([1, 2, 3]),
  dhikrMap = new Map(mockDhikrList.map((d) => [d.id, d])),
}: {
  favoriteIds?: Set<number>;
  dhikrMap?: Map<number, Dhikr | null>;
} = {}) {
  mockIsFavorite.mockImplementation((id: number) => favoriteIds.has(id));

  mockUseFavoritesStore.mockImplementation(
    (
      selector: (s: {
        dhikrIds: Set<number>;
        removeFavorite: (id: number) => void;
        isFavorite: (id: number) => boolean;
      }) => unknown,
    ) =>
      selector({
        dhikrIds: favoriteIds,
        removeFavorite: mockRemoveFavorite,
        isFavorite: mockIsFavorite,
      }),
  );

  // Mock DB: openContentDb returns a fake db object
  mockOpenContentDb.mockResolvedValue({});

  // Mock getDhikrById to return from the map
  mockGetDhikrById.mockImplementation(
    (_db: unknown, id: number, _locale: string) =>
      Promise.resolve(dhikrMap.get(id) ?? null),
  );
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={testI18n}>
      <FavoritesScreen />
    </I18nextProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('FavoritesScreen', () => {
  // ── Favorites list ─────────────────────────────────────────────────────────

  describe('Favorites list', () => {
    it('renders the favorites list after loading', async () => {
      const { findByTestId } = renderScreen();
      const list = await findByTestId('favorites-list');
      expect(list).toBeTruthy();
    });

    it('renders a DhikrCard for each favorited dhikr', async () => {
      const { findAllByTestId } = renderScreen();
      const cards = await findAllByTestId('dhikr-card');
      expect(cards).toHaveLength(mockDhikrList.length);
    });

    it('renders the Arabic text of each favorited dhikr', async () => {
      const { findByText } = renderScreen();
      expect(await findByText('سُبْحَانَ اللَّهِ 1')).toBeTruthy();
      expect(await findByText('سُبْحَانَ اللَّهِ 2')).toBeTruthy();
      expect(await findByText('سُبْحَانَ اللَّهِ 3')).toBeTruthy();
    });

    it('shows filled star for each favorited dhikr', async () => {
      const { findAllByText } = renderScreen();
      const stars = await findAllByText('★');
      expect(stars).toHaveLength(mockDhikrList.length);
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('Empty state', () => {
    it('renders the empty state when there are no favorites', async () => {
      setupDefaults({ favoriteIds: new Set(), dhikrMap: new Map() });
      const { findByTestId } = renderScreen();
      const empty = await findByTestId('favorites-empty');
      expect(empty).toBeTruthy();
    });

    it('renders the empty state title', async () => {
      setupDefaults({ favoriteIds: new Set(), dhikrMap: new Map() });
      const { findByTestId } = renderScreen();
      const title = await findByTestId('favorites-empty-title');
      expect(title).toBeTruthy();
    });

    it('renders the empty state message prompting to add favorites', async () => {
      setupDefaults({ favoriteIds: new Set(), dhikrMap: new Map() });
      const { findByTestId } = renderScreen();
      const msg = await findByTestId('favorites-empty-message');
      expect(msg).toBeTruthy();
    });

    it('does not render the favorites list in empty state', async () => {
      setupDefaults({ favoriteIds: new Set(), dhikrMap: new Map() });
      const { queryByTestId, findByTestId } = renderScreen();
      // Wait for loading to finish
      await findByTestId('favorites-empty');
      expect(queryByTestId('favorites-list')).toBeNull();
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('navigates to dhikr/[id] when a card is pressed', async () => {
      const { findAllByTestId } = renderScreen();
      const cards = await findAllByTestId('dhikr-card');
      fireEvent.press(cards[0]);
      expect(mockPush).toHaveBeenCalledWith('/dhikr/1');
    });

    it('navigates to the correct dhikr id for the second card', async () => {
      const { findAllByTestId } = renderScreen();
      const cards = await findAllByTestId('dhikr-card');
      fireEvent.press(cards[1]);
      expect(mockPush).toHaveBeenCalledWith('/dhikr/2');
    });
  });

  // ── Favorite toggle (remove) ───────────────────────────────────────────────

  describe('Favorite toggle', () => {
    it('calls removeFavorite when the favorite toggle is pressed', async () => {
      const { findAllByTestId } = renderScreen();
      const toggles = await findAllByTestId('dhikr-card-favorite');
      fireEvent.press(toggles[0]);
      expect(mockRemoveFavorite).toHaveBeenCalledWith(1);
    });

    it('calls removeFavorite with the correct id for the second card', async () => {
      const { findAllByTestId } = renderScreen();
      const toggles = await findAllByTestId('dhikr-card-favorite');
      fireEvent.press(toggles[1]);
      expect(mockRemoveFavorite).toHaveBeenCalledWith(2);
    });

    it('does not call removeFavorite for a different card', async () => {
      const { findAllByTestId } = renderScreen();
      const toggles = await findAllByTestId('dhikr-card-favorite');
      fireEvent.press(toggles[0]);
      expect(mockRemoveFavorite).not.toHaveBeenCalledWith(2);
      expect(mockRemoveFavorite).not.toHaveBeenCalledWith(3);
    });

    it('updates the list when a favorite is removed', async () => {
      // Start with 3 favorites; after removing id=1, the store returns 2
      const remainingIds = new Set<number>([2, 3]);
      const remainingDhikr = new Map([
        [2, makeDhikr(2)],
        [3, makeDhikr(3)],
      ]);

      // Initial render with 3 favorites
      setupDefaults();
      const { findAllByTestId, rerender } = renderScreen();
      expect(await findAllByTestId('dhikr-card')).toHaveLength(3);

      // Simulate store update after removal
      setupDefaults({ favoriteIds: remainingIds, dhikrMap: remainingDhikr });

      await act(async () => {
        rerender(
          <I18nextProvider i18n={testI18n}>
            <FavoritesScreen />
          </I18nextProvider>,
        );
      });

      await waitFor(async () => {
        const cards = await findAllByTestId('dhikr-card');
        expect(cards).toHaveLength(2);
      });
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while favorites are loading', () => {
      // Make openContentDb never resolve so loading stays true
      mockOpenContentDb.mockReturnValue(new Promise(() => {}));
      const { getByTestId } = renderScreen();
      expect(getByTestId('favorites-loading')).toBeTruthy();
    });

    it('does not render the favorites list while loading', () => {
      mockOpenContentDb.mockReturnValue(new Promise(() => {}));
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('favorites-list')).toBeNull();
    });

    it('does not render the empty state while loading', () => {
      mockOpenContentDb.mockReturnValue(new Promise(() => {}));
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('favorites-empty')).toBeNull();
    });
  });
});
