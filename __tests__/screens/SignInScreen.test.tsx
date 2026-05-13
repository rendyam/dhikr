/**
 * Component tests for app/sign-in.tsx — Sign-In screen
 *
 * Covers:
 *   - "Sign in with Google" button is rendered
 *   - Pressing the button calls authStore.signInWithGoogle()
 *   - Loading state: ActivityIndicator visible, button disabled while signing in
 *   - Error message shown on sign-in failure (network, cancelled, generic)
 *   - router.back() is called on successful sign-in
 *   - Error is dismissed when dismiss button is pressed
 *
 * Requirements: 16.1, 16.2, 16.7, 16.8
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import SignInScreen from '../../app/sign-in';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

// authStore
const mockSignInWithGoogle = jest.fn();
const mockUseAuthStore = jest.fn();
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (s: {
    signInWithGoogle: () => Promise<void>;
    isLoading: boolean;
  }) => unknown) => mockUseAuthStore(selector),
}));

// expo-web-browser (imported transitively by authStore)
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// expo-auth-session (imported transitively by authStore)
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'https://auth.expo.io/redirect'),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

// firebase/auth (imported transitively by authStore)
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: class {
    static credential() { return {}; }
  },
  signInWithCredential: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

// i18next — use real translations from en.json
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import enTranslations from '../../src/i18n/locales/en.json';

const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: enTranslations } },
  interpolation: { escapeValue: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

type AuthState = {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
};

function setupAuth({ isLoading = false }: { isLoading?: boolean } = {}) {
  mockUseAuthStore.mockImplementation(
    (selector: (s: AuthState) => unknown) =>
      selector({ signInWithGoogle: mockSignInWithGoogle, isLoading }),
  );
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={testI18n}>
      <SignInScreen />
    </I18nextProvider>,
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupAuth();
  mockSignInWithGoogle.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SignInScreen', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the screen container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-screen')).toBeTruthy();
    });

    it('renders the title', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-title')).toBeTruthy();
    });

    it('renders the subtitle', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-subtitle')).toBeTruthy();
    });

    it('renders the "Sign in with Google" button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-google-button')).toBeTruthy();
    });

    it('renders the Google logo inside the button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-google-logo')).toBeTruthy();
    });

    it('renders the button text "Sign in with Google"', () => {
      const { getByText } = renderScreen();
      expect(getByText('Sign in with Google')).toBeTruthy();
    });

    it('does not show an error message initially', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('sign-in-error')).toBeNull();
    });

    it('does not show the loading indicator initially', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('sign-in-loading-indicator')).toBeNull();
    });
  });

  // ── Button press ───────────────────────────────────────────────────────────

  describe('Button press', () => {
    it('calls authStore.signInWithGoogle() when button is pressed', async () => {
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('calls router.back() on successful sign-in', async () => {
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('does not call router.back() when sign-in fails', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('auth failed'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state (isLoading === true)', () => {
    beforeEach(() => {
      setupAuth({ isLoading: true });
    });

    it('shows the ActivityIndicator when isLoading is true', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-loading-indicator')).toBeTruthy();
    });

    it('hides the Google logo when isLoading is true', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('sign-in-google-logo')).toBeNull();
    });

    it('disables the button when isLoading is true', () => {
      const { getByTestId } = renderScreen();
      const button = getByTestId('sign-in-google-button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('sets accessibilityState.busy to true when isLoading is true', () => {
      const { getByTestId } = renderScreen();
      const button = getByTestId('sign-in-google-button');
      expect(button.props.accessibilityState?.busy).toBe(true);
    });

    it('does not call signInWithGoogle when button is pressed while loading', async () => {
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(mockSignInWithGoogle).not.toHaveBeenCalled();
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('shows a generic error message when sign-in throws a generic error', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('something went wrong'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(getByTestId('sign-in-error')).toBeTruthy();
      expect(getByTestId('sign-in-error-message').props.children).toBe(
        'Something went wrong. Please try again.',
      );
    });

    it('shows a network error message when sign-in throws a network error', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('network timeout'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(getByTestId('sign-in-error-message').props.children).toBe(
        'A network error occurred. Please check your connection and try again.',
      );
    });

    it('shows a cancelled message when sign-in is cancelled', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('user_cancelled'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(getByTestId('sign-in-error-message').props.children).toBe(
        'Sign-in was cancelled.',
      );
    });

    it('shows a cancelled message when error contains "cancel"', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('auth/popup-closed-by-user cancel'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(getByTestId('sign-in-error-message').props.children).toBe(
        'Sign-in was cancelled.',
      );
    });

    it('remains on the sign-in screen after an error', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('auth failed'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      // Screen is still rendered
      expect(getByTestId('sign-in-screen')).toBeTruthy();
      // router.back() was NOT called
      expect(mockBack).not.toHaveBeenCalled();
    });

    it('shows the dismiss button when an error is displayed', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('auth failed'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(getByTestId('sign-in-dismiss-error')).toBeTruthy();
    });

    it('dismisses the error when the dismiss button is pressed', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('auth failed'));
      const { getByTestId, queryByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      // Error is shown
      expect(getByTestId('sign-in-error')).toBeTruthy();
      // Dismiss it
      fireEvent.press(getByTestId('sign-in-dismiss-error'));
      // Error is gone
      expect(queryByTestId('sign-in-error')).toBeNull();
    });

    it('clears the previous error when sign-in is retried', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('auth failed'));
      const { getByTestId, queryByTestId } = renderScreen();
      // First attempt — error shown
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(getByTestId('sign-in-error')).toBeTruthy();
      // Second attempt — succeeds
      mockSignInWithGoogle.mockResolvedValueOnce(undefined);
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(queryByTestId('sign-in-error')).toBeNull();
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('sets accessibilityRole="button" on the sign-in button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-google-button').props.accessibilityRole).toBe('button');
    });

    it('sets accessibilityLabel to the button text when not loading', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-google-button').props.accessibilityLabel).toBe(
        'Sign in with Google',
      );
    });

    it('sets accessibilityLabel to loading text when isLoading is true', () => {
      setupAuth({ isLoading: true });
      const { getByTestId } = renderScreen();
      expect(getByTestId('sign-in-google-button').props.accessibilityLabel).toBe(
        'Signing in\u2026',
      );
    });

    it('sets accessibilityRole="button" on the dismiss error button', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('auth failed'));
      const { getByTestId } = renderScreen();
      await act(async () => {
        fireEvent.press(getByTestId('sign-in-google-button'));
      });
      expect(getByTestId('sign-in-dismiss-error').props.accessibilityRole).toBe('button');
    });
  });
});
