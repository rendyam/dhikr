/**
 * Component tests for app/(tabs)/index.tsx — Home screen
 *
 * Covers:
 *   - Renders StreakWidget with streak count and checked-in state
 *   - Renders category grid with CategoryCard components
 *   - Renders favorites shortcut section (empty state)
 *   - Renders favorites shortcut chips when favorites exist
 *   - Navigates to category/[id] on category card press
 *   - Navigates to favorites tab on favorites shortcut press
 *   - Renders StreakNudgeModal when shouldShow === true
 *   - Does not render StreakNudgeModal when shouldShow === false
 *   - Shows loading indicator while categories are loading
 *   - Shows error message when categories fail to load
 *
 * Requirements: 2.2, 10.2, 14.2, 14.5, 21.1
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// useCategories hook
const mockUseCategories = jest.fn();
jest.mock('../../src/hooks/useCategories', () => ({
  useCategories: () => mockUseCategories(),
}));

// useStreakNudge hook
const mockNudgeDismiss = jest.fn();
const mockNudgeDismissPermanently = jest.fn();
const mockUseStreakNudge = jest.fn();
jest.mock('../../src/hooks/useStreakNudge', () => ({
  useStreakNudge: () => mockUseStreakNudge(),
}));

// streakStore
const mockUseStreakStore = jest.fn();
jest.mock('../../src/store/streakStore', () => ({
  useStreakStore: (selector: (s: { currentStreak: number; checkedInToday: boolean }) => unknown) =>
    mockUseStreakStore(selector),
}));

// favoritesStore
const mockUseFavoritesStore = jest.fn();
jest.mock('../../src/store/favoritesStore', () => ({
  useFavoritesStore: (selector: (s: { dhikrIds: Set<number> }) => unknown) =>
    mockUseFavoritesStore(selector),
}));

// DB client (not used directly by the screen, but imported transitively)
jest.mock('../../src/db/client', () => ({
  openContentDb: jest.fn(),
  openUserDb: jest.fn(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockCategories = [
  { id: 1, slug: 'morning', nameAr: 'أذكار الصباح', name: 'Morning Adhkar', sortOrder: 1 },
  { id: 2, slug: 'evening', nameAr: 'أذكار المساء', name: 'Evening Adhkar', sortOrder: 2 },
  { id: 3, slug: 'after-prayer', nameAr: 'أذكار بعد الصلاة', name: 'After Prayer', sortOrder: 3 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupDefaults({
  streak = 5,
  checkedInToday = false,
  categories = mockCategories,
  isLoading = false,
  error = null,
  favoriteIds = new Set<number>(),
  nudgeShouldShow = false,
}: {
  streak?: number;
  checkedInToday?: boolean;
  categories?: typeof mockCategories;
  isLoading?: boolean;
  error?: Error | null;
  favoriteIds?: Set<number>;
  nudgeShouldShow?: boolean;
} = {}) {
  // streakStore selector calls
  mockUseStreakStore.mockImplementation(
    (selector: (s: { currentStreak: number; checkedInToday: boolean }) => unknown) =>
      selector({ currentStreak: streak, checkedInToday }),
  );

  mockUseCategories.mockReturnValue({ categories, isLoading, error });

  mockUseFavoritesStore.mockImplementation(
    (selector: (s: { dhikrIds: Set<number> }) => unknown) =>
      selector({ dhikrIds: favoriteIds }),
  );

  mockUseStreakNudge.mockReturnValue({
    shouldShow: nudgeShouldShow,
    dismiss: mockNudgeDismiss,
    dismissPermanently: mockNudgeDismissPermanently,
  });
}

function renderHome() {
  return render(<HomeScreen />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('HomeScreen', () => {
  // ── StreakWidget ───────────────────────────────────────────────────────────

  describe('StreakWidget', () => {
    it('renders the streak widget', () => {
      setupDefaults({ streak: 7 });
      const { getByTestId } = renderHome();
      expect(getByTestId('streak-widget')).toBeTruthy();
    });

    it('displays the current streak count', () => {
      setupDefaults({ streak: 12 });
      const { getByTestId } = renderHome();
      expect(getByTestId('streak-widget-count').props.children).toBe(12);
    });

    it('passes checkedInToday=true to StreakWidget', () => {
      setupDefaults({ streak: 3, checkedInToday: true });
      const { getByTestId } = renderHome();
      expect(getByTestId('streak-widget').props.accessibilityLabel).toContain('checked in today');
    });

    it('passes checkedInToday=false to StreakWidget', () => {
      setupDefaults({ streak: 3, checkedInToday: false });
      const { getByTestId } = renderHome();
      expect(getByTestId('streak-widget').props.accessibilityLabel).toContain('not checked in today');
    });
  });

  // ── Category grid ──────────────────────────────────────────────────────────

  describe('Category grid', () => {
    it('renders the category grid', () => {
      const { getByTestId } = renderHome();
      expect(getByTestId('home-category-grid')).toBeTruthy();
    });

    it('renders a CategoryCard for each category', () => {
      const { getAllByTestId } = renderHome();
      expect(getAllByTestId('category-card')).toHaveLength(mockCategories.length);
    });

    it('renders the translated category name for each card', () => {
      const { getByText } = renderHome();
      expect(getByText('Morning Adhkar')).toBeTruthy();
      expect(getByText('Evening Adhkar')).toBeTruthy();
      expect(getByText('After Prayer')).toBeTruthy();
    });

    it('renders the Arabic category name for each card', () => {
      const { getByText } = renderHome();
      expect(getByText('أذكار الصباح')).toBeTruthy();
      expect(getByText('أذكار المساء')).toBeTruthy();
    });

    it('navigates to category/[id] when a category card is pressed', () => {
      const { getAllByTestId } = renderHome();
      fireEvent.press(getAllByTestId('category-card')[0]);
      expect(mockPush).toHaveBeenCalledWith('/category/1');
    });

    it('navigates to the correct category id for the second card', () => {
      const { getAllByTestId } = renderHome();
      fireEvent.press(getAllByTestId('category-card')[1]);
      expect(mockPush).toHaveBeenCalledWith('/category/2');
    });
  });

  // ── Favorites shortcut ─────────────────────────────────────────────────────

  describe('Favorites shortcut', () => {
    it('renders the favorites section', () => {
      const { getByTestId } = renderHome();
      expect(getByTestId('home-favorites-section')).toBeTruthy();
    });

    it('shows empty-state prompt when there are no favorites', () => {
      setupDefaults({ favoriteIds: new Set() });
      const { getByTestId } = renderHome();
      expect(getByTestId('home-favorites-empty')).toBeTruthy();
    });

    it('shows favorite chips when favorites exist', () => {
      setupDefaults({ favoriteIds: new Set([10, 20, 30]) });
      const { getByTestId } = renderHome();
      expect(getByTestId('home-favorites-shortcut')).toBeTruthy();
    });

    it('shows at most 3 favorite chips', () => {
      setupDefaults({ favoriteIds: new Set([10, 20, 30, 40, 50]) });
      const { getAllByTestId } = renderHome();
      // chips are testID="home-favorite-chip-{id}"
      const chips = getAllByTestId(/^home-favorite-chip-/);
      expect(chips).toHaveLength(3);
    });

    it('navigates to favorites tab when empty-state is pressed', () => {
      setupDefaults({ favoriteIds: new Set() });
      const { getByTestId } = renderHome();
      fireEvent.press(getByTestId('home-favorites-empty'));
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/favorites');
    });

    it('navigates to favorites tab when "See all" is pressed', () => {
      const { getByTestId } = renderHome();
      fireEvent.press(getByTestId('home-favorites-see-all'));
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/favorites');
    });

    it('navigates to favorites tab when a favorite chip is pressed', () => {
      setupDefaults({ favoriteIds: new Set([42]) });
      const { getByTestId } = renderHome();
      fireEvent.press(getByTestId('home-favorite-chip-42'));
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/favorites');
    });
  });

  // ── StreakNudgeModal ───────────────────────────────────────────────────────

  describe('StreakNudgeModal', () => {
    it('renders StreakNudgeModal when shouldShow is true', () => {
      setupDefaults({ nudgeShouldShow: true, streak: 5 });
      const { getByTestId } = renderHome();
      expect(getByTestId('streak-nudge-modal')).toBeTruthy();
    });

    it('modal is not rendered when shouldShow is false', () => {
      setupDefaults({ nudgeShouldShow: false });
      const { queryByTestId } = renderHome();
      // React Native Modal with visible=false is not mounted in the test tree
      expect(queryByTestId('streak-nudge-modal')).toBeNull();
    });

    it('calls dismiss when "Maybe Later" is pressed', () => {
      setupDefaults({ nudgeShouldShow: true });
      const { getByTestId } = renderHome();
      fireEvent.press(getByTestId('streak-nudge-later'));
      expect(mockNudgeDismiss).toHaveBeenCalledTimes(1);
    });

    it('calls dismissPermanently when "Don\'t show again" is pressed', () => {
      setupDefaults({ nudgeShouldShow: true });
      const { getByTestId } = renderHome();
      fireEvent.press(getByTestId('streak-nudge-dismiss-permanently'));
      expect(mockNudgeDismissPermanently).toHaveBeenCalledTimes(1);
    });

    it('navigates to sign-in and dismisses when "Sign In" is pressed', () => {
      setupDefaults({ nudgeShouldShow: true });
      const { getByTestId } = renderHome();
      fireEvent.press(getByTestId('streak-nudge-sign-in'));
      expect(mockNudgeDismiss).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while categories are loading', () => {
      setupDefaults({ isLoading: true, categories: [] });
      const { getByTestId } = renderHome();
      expect(getByTestId('home-loading')).toBeTruthy();
    });

    it('does not render the category grid while loading', () => {
      setupDefaults({ isLoading: true, categories: [] });
      const { queryByTestId } = renderHome();
      expect(queryByTestId('home-category-grid')).toBeNull();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error message when categories fail to load', () => {
      setupDefaults({ error: new Error('DB error'), categories: [] });
      const { getByTestId } = renderHome();
      expect(getByTestId('home-error')).toBeTruthy();
    });

    it('does not render the category grid on error', () => {
      setupDefaults({ error: new Error('DB error'), categories: [] });
      const { queryByTestId } = renderHome();
      expect(queryByTestId('home-category-grid')).toBeNull();
    });
  });
});
