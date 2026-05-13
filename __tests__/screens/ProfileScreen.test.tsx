/**
 * Component tests for app/(tabs)/profile.tsx — Profile screen
 *
 * Covers:
 *   - Guest state: sign-in button, settings button, badge display, no sign-out
 *   - Authenticated state: display name, email, avatar, sign-out, settings, badges
 *   - Loading state: sign-out button shows loading/disabled when isLoading === true
 *
 * Requirements: 14.7, 16.4, 16.5
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';
import type { Badge } from '../../src/types/user';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// authStore
const mockSignOut = jest.fn();
const mockUseAuthStore = jest.fn();
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (s: {
    user: unknown;
    isLoading: boolean;
    signOut: () => Promise<void>;
  }) => unknown) => mockUseAuthStore(selector),
}));

// streakStore
const mockUseStreakStore = jest.fn();
jest.mock('../../src/store/streakStore', () => ({
  useStreakStore: (selector: (s: { badges: Badge[] }) => unknown) =>
    mockUseStreakStore(selector),
}));

// BadgeDisplay — keep real implementation but allow testID assertions
// (no mock needed; the real component renders with testID="badge-display")

// DB client (imported transitively)
jest.mock('../../src/db/client', () => ({
  openContentDb: jest.fn(),
  openUserDb: jest.fn(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  uid: 'user-123',
  displayName: 'Ahmad Fauzi',
  email: 'ahmad@example.com',
  photoURL: 'https://example.com/photo.jpg',
};

const mockUserNoPhoto = {
  uid: 'user-456',
  displayName: 'Siti Rahma',
  email: 'siti@example.com',
  photoURL: null,
};

const mockBadges: Badge[] = [
  { milestone: 7, earnedAt: 1700000000, rewardClaimed: false },
  { milestone: 30, earnedAt: 1702000000, rewardClaimed: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

type AuthState = {
  user: typeof mockUser | typeof mockUserNoPhoto | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

function setupAuth({
  user = null as AuthState['user'],
  isLoading = false,
}: {
  user?: AuthState['user'];
  isLoading?: boolean;
} = {}) {
  mockUseAuthStore.mockImplementation(
    (selector: (s: AuthState) => unknown) =>
      selector({ user, isLoading, signOut: mockSignOut }),
  );
}

function setupStreak({ badges = [] as Badge[] } = {}) {
  mockUseStreakStore.mockImplementation(
    (selector: (s: { badges: Badge[] }) => unknown) =>
      selector({ badges }),
  );
}

function renderScreen() {
  return render(<ProfileScreen />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupAuth();
  setupStreak();
});

describe('ProfileScreen', () => {
  // ── Common ─────────────────────────────────────────────────────────────────

  describe('Common elements', () => {
    it('renders the profile title', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-title')).toBeTruthy();
    });

    it('renders the scroll container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-scroll')).toBeTruthy();
    });
  });

  // ── Guest state ────────────────────────────────────────────────────────────

  describe('Guest state (user === null)', () => {
    beforeEach(() => {
      setupAuth({ user: null });
      setupStreak({ badges: [] });
    });

    it('renders the sign-in button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-sign-in-button')).toBeTruthy();
    });

    it('sign-in button navigates to /sign-in', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('profile-sign-in-button'));
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });

    it('renders the settings button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-settings-button')).toBeTruthy();
    });

    it('settings button navigates to /settings', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('profile-settings-button'));
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('does NOT show the sign-out button', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('profile-sign-out-button')).toBeNull();
    });

    it('does NOT show the display name', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('profile-display-name')).toBeNull();
    });

    it('does NOT show the email', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('profile-email')).toBeNull();
    });

    it('shows BadgeDisplay component', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('badge-display')).toBeTruthy();
    });

    it('shows a sign-in benefits message', () => {
      const { getByText } = renderScreen();
      // The message mentions syncing streak and favorites
      expect(getByText(/sync/i)).toBeTruthy();
    });
  });

  // ── Authenticated state ────────────────────────────────────────────────────

  describe('Authenticated state (user !== null)', () => {
    beforeEach(() => {
      setupAuth({ user: mockUser });
      setupStreak({ badges: mockBadges });
    });

    it('shows the display name', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-display-name').props.children).toBe('Ahmad Fauzi');
    });

    it('shows the email', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-email').props.children).toBe('ahmad@example.com');
    });

    it('shows avatar image when photoURL is set', () => {
      const { getByTestId } = renderScreen();
      const avatar = getByTestId('profile-avatar');
      expect(avatar).toBeTruthy();
      // Image component has source prop with uri
      expect(avatar.props.source).toEqual({ uri: 'https://example.com/photo.jpg' });
    });

    it('shows placeholder avatar with initials when photoURL is null', () => {
      setupAuth({ user: mockUserNoPhoto });
      const { getByTestId, getByText } = renderScreen();
      // The placeholder view still has testID="profile-avatar"
      expect(getByTestId('profile-avatar')).toBeTruthy();
      // Shows the first initial of the display name
      expect(getByText('S')).toBeTruthy();
    });

    it('shows the sign-out button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-sign-out-button')).toBeTruthy();
    });

    it('sign-out button calls authStore.signOut()', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('profile-sign-out-button'));
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('renders the settings button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('profile-settings-button')).toBeTruthy();
    });

    it('settings button navigates to /settings', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('profile-settings-button'));
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('does NOT show the sign-in button', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('profile-sign-in-button')).toBeNull();
    });

    it('shows BadgeDisplay component', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('badge-display')).toBeTruthy();
    });

    it('passes earned badges to BadgeDisplay', () => {
      // The 7-day and 30-day badges should be shown as earned (no lock icon)
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('badge-lock-7')).toBeNull();
      expect(queryByTestId('badge-lock-30')).toBeNull();
      // 100-day badge not earned — lock icon present
      expect(queryByTestId('badge-lock-100')).toBeTruthy();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    beforeEach(() => {
      setupAuth({ user: mockUser, isLoading: true });
      setupStreak({ badges: [] });
    });

    it('sign-out button is disabled when isLoading is true', () => {
      const { getByTestId } = renderScreen();
      const btn = getByTestId('profile-sign-out-button');
      // TouchableOpacity passes disabled prop
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });

    it('sign-out button shows an ActivityIndicator when isLoading is true', () => {
      const { getByTestId, UNSAFE_queryByType } = renderScreen();
      expect(getByTestId('profile-sign-out-button')).toBeTruthy();
      // ActivityIndicator should be present inside the button
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    });
  });
});
