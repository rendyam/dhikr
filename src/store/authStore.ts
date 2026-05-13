/**
 * Auth store — manages Firebase Authentication state.
 *
 * State:
 *   - user        The currently signed-in Firebase user, or null for Guest mode
 *   - isLoading   True while a sign-in or sign-out operation is in progress
 *
 * Actions:
 *   - signInWithGoogle()   Initiates Google Sign-In via expo-auth-session (mobile)
 *                          or signInWithPopup (web); exchanges for a Firebase credential
 *   - signOut()            Signs out of Firebase; clears local session state
 *   - setUser(user)        Directly sets the user (called by onAuthStateChanged listener)
 *
 * Persistence:
 *   NOT persisted via zustand middleware — the Firebase SDK manages its own
 *   token persistence internally. The store is re-hydrated on every app launch
 *   by the onAuthStateChanged listener in app/_layout.tsx calling setUser().
 *
 * Platform notes:
 *   - Mobile (Android/iOS): uses expo-auth-session + expo-web-browser to open
 *     the Google OAuth consent screen, then exchanges the auth code for a
 *     Firebase GoogleAuthProvider credential.
 *   - Web: uses Firebase's signInWithPopup directly.
 *
 * Requirements: 16.1, 16.2, 16.5, 16.7
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

// Ensure the web browser auth session is completed on mobile
WebBrowser.maybeCompleteAuthSession();

// ── State & actions interface ─────────────────────────────────────────────────

export interface AuthState {
  /** The currently signed-in Firebase user, or null if in Guest mode. */
  user: FirebaseUser | null;
  /** True while a sign-in or sign-out operation is in progress. */
  isLoading: boolean;

  /**
   * Initiates Google Sign-In.
   * - Mobile: uses expo-auth-session to open the Google OAuth consent screen,
   *   then exchanges the auth code for a Firebase credential.
   * - Web: uses Firebase's signInWithPopup.
   * On success, the Firebase SDK calls onAuthStateChanged which updates the
   * store via setUser(). On error, isLoading is reset and the error is thrown
   * so the caller can display an appropriate message.
   */
  signInWithGoogle: () => Promise<void>;

  /**
   * Signs out of Firebase and clears the local session.
   * Reverts the app to Guest User mode (user = null).
   */
  signOut: () => Promise<void>;

  /**
   * Directly sets the user in the store.
   * Called by the onAuthStateChanged listener in app/_layout.tsx on every
   * auth state change (sign-in, sign-out, token refresh).
   */
  setUser: (user: FirebaseUser | null) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  user: null,
  isLoading: false,

  // ── Actions ──────────────────────────────────────────────────────────────

  signInWithGoogle: async () => {
    set({ isLoading: true });

    try {
      const auth = getAuth();

      if (Platform.OS === 'web') {
        // ── Web: use Firebase signInWithPopup ──────────────────────────────
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will call setUser() — no need to set user here
      } else {
        // ── Mobile: use expo-auth-session ──────────────────────────────────
        // Build the redirect URI for the current environment
        const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

        // Create the Google auth request
        const [, response, promptAsync] = Google.useAuthRequest({
          clientId: undefined, // Configured via app.json / EAS env vars
          redirectUri,
        });

        // Prompt the user to sign in
        const result = await promptAsync();

        if (result.type !== 'success') {
          // User cancelled or an error occurred — not a crash, just exit
          set({ isLoading: false });
          return;
        }

        // Exchange the auth code / id_token for a Firebase credential
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
        // onAuthStateChanged will call setUser()
      }
    } catch (error) {
      set({ isLoading: false });
      throw error; // Caller (sign-in screen) handles the error toast
    }

    set({ isLoading: false });
  },

  signOut: async () => {
    set({ isLoading: true });

    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
      // Clear local session state — revert to Guest mode
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setUser: (user: FirebaseUser | null) => {
    set({ user, isLoading: false });
  },
}));
