/**
 * Component tests for app/session/[categoryId].tsx — Guided Session screen
 *
 * Covers:
 *   - Shows loading indicator while dhikr list is loading
 *   - Shows error message when dhikr list fails to load
 *   - Starts session with correct categoryId and dhikrIds on mount
 *   - Renders Arabic text, translation, and progress bar for current dhikr
 *   - Tapping the counter calls sessionStore.increment()
 *   - "Next" button is shown when count >= target
 *   - "Next" button is NOT shown when count < target
 *   - "Next" button is always shown when target is null
 *   - Pressing "Next" calls sessionStore.advance()
 *   - Completion indicator shown when count >= target
 *   - Session completion screen shown when isComplete === true
 *   - Exit button triggers Alert confirmation
 *   - Confirming exit calls exitSession() and navigates back
 *
 * Requirements: 4.1–4.7, 5.1–5.4
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SessionScreen from '../../app/session/[categoryId]';
import type { Dhikr } from '../../src/types/content';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ categoryId: '1' }),
}));

// useDhikrByCategory hook
const mockUseDhikrByCategory = jest.fn();
jest.mock('../../src/hooks/useDhikrByCategory', () => ({
  useDhikrByCategory: (categoryId: number) => mockUseDhikrByCategory(categoryId),
}));

// useDhikr hook
const mockUseDhikr = jest.fn();
jest.mock('../../src/hooks/useDhikr', () => ({
  useDhikr: (dhikrId: number) => mockUseDhikr(dhikrId),
}));

// settingsStore (required by useDhikr internally, but we mock useDhikr directly)
jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: (selector: (s: { language: string }) => unknown) =>
    selector({ language: 'en' }),
}));

// sessionStore — we control state and capture action calls
const mockStartSession = jest.fn();
const mockIncrement = jest.fn();
const mockResetCount = jest.fn();
const mockAdvance = jest.fn();
const mockExitSession = jest.fn();

// Mutable session state that tests can override
let mockSessionState = {
  categoryId: null as number | null,
  dhikrIds: [] as number[],
  currentIndex: 0,
  count: 0,
  isComplete: false,
};

jest.mock('../../src/store/sessionStore', () => ({
  useSessionStore: (selector: (s: typeof mockSessionState & {
    startSession: typeof mockStartSession;
    increment: typeof mockIncrement;
    resetCount: typeof mockResetCount;
    advance: typeof mockAdvance;
    exitSession: typeof mockExitSession;
  }) => unknown) =>
    selector({
      ...mockSessionState,
      startSession: mockStartSession,
      increment: mockIncrement,
      resetCount: mockResetCount,
      advance: mockAdvance,
      exitSession: mockExitSession,
    }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeDhikr = (id: number, repetitionCount: number | null = 33): Dhikr => ({
  id,
  arabicText: `سُبْحَانَ اللَّهِ ${id}`,
  transliteration: `Subhana Allahi ${id}`,
  translation: `Glory be to Allah ${id}`,
  translationFallback: false,
  repetitionCount,
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

const mockDhikrList: Dhikr[] = [makeDhikr(10, 33), makeDhikr(20, 7), makeDhikr(30, null)];

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupDefaults({
  dhikrList = mockDhikrList,
  isLoading = false,
  error = null,
  sessionState = {},
  currentDhikr = mockDhikrList[0],
  dhikrLoading = false,
  dhikrError = null,
}: {
  dhikrList?: Dhikr[];
  isLoading?: boolean;
  error?: Error | null;
  sessionState?: Partial<typeof mockSessionState>;
  currentDhikr?: Dhikr | null;
  dhikrLoading?: boolean;
  dhikrError?: Error | null;
} = {}) {
  mockUseDhikrByCategory.mockReturnValue({ dhikrList, isLoading, error });
  mockUseDhikr.mockReturnValue({ dhikr: currentDhikr, isLoading: dhikrLoading, error: dhikrError });

  mockSessionState = {
    categoryId: null,
    dhikrIds: dhikrList.map((d) => d.id),
    currentIndex: 0,
    count: 0,
    isComplete: false,
    ...sessionState,
  };
}

function renderScreen() {
  return render(<SessionScreen />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaults();
});

describe('SessionScreen', () => {
  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while dhikr list is loading', () => {
      setupDefaults({ isLoading: true, dhikrList: [] });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-loading')).toBeTruthy();
    });

    it('does not show dhikr view while loading', () => {
      setupDefaults({ isLoading: true, dhikrList: [] });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-dhikr-view')).toBeNull();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error message when dhikr list fails to load', () => {
      setupDefaults({ error: new Error('DB error'), dhikrList: [] });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-error')).toBeTruthy();
    });

    it('does not show dhikr view on error', () => {
      setupDefaults({ error: new Error('DB error'), dhikrList: [] });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-dhikr-view')).toBeNull();
    });
  });

  // ── Session start ──────────────────────────────────────────────────────────

  describe('Session start', () => {
    it('calls startSession with categoryId and dhikrIds on mount', () => {
      setupDefaults();
      renderScreen();
      expect(mockStartSession).toHaveBeenCalledWith(1, [10, 20, 30]);
    });

    it('calls startSession with the correct categoryId from route params', () => {
      setupDefaults();
      renderScreen();
      expect(mockStartSession).toHaveBeenCalledWith(1, expect.any(Array));
    });
  });

  // ── Dhikr display ──────────────────────────────────────────────────────────

  describe('Dhikr display', () => {
    it('renders the session screen container', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-screen')).toBeTruthy();
    });

    it('renders the header', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-header')).toBeTruthy();
    });

    it('renders the dhikr view when session is active', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-dhikr-view')).toBeTruthy();
    });

    it('renders the translation of the current dhikr', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-translation')).toBeTruthy();
    });

    it('renders the progress bar', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-progress-container')).toBeTruthy();
    });

    it('renders the progress label with correct current/total', () => {
      setupDefaults({
        sessionState: { currentIndex: 0, dhikrIds: [10, 20, 30] },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-progress-label').props.children).toEqual([
        1, ' / ', 3,
      ]);
    });

    it('renders the counter component', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('counter-wrapper')).toBeTruthy();
    });

    it('renders the repetition count when target is defined', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-repetition-count')).toBeTruthy();
    });

    it('does not render repetition count when target is null', () => {
      setupDefaults({
        currentDhikr: makeDhikr(30, null),
        sessionState: { dhikrIds: [30], currentIndex: 0 },
      });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-repetition-count')).toBeNull();
    });

    it('shows translation fallback notice when translationFallback is true', () => {
      const fallbackDhikr: Dhikr = { ...makeDhikr(10), translationFallback: true };
      setupDefaults({ currentDhikr: fallbackDhikr });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-translation-fallback')).toBeTruthy();
    });

    it('does not show translation fallback notice when translationFallback is false', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-translation-fallback')).toBeNull();
    });
  });

  // ── Counter interaction ────────────────────────────────────────────────────

  describe('Counter interaction', () => {
    it('calls increment when the counter is tapped', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('counter-pressable'));
      expect(mockIncrement).toHaveBeenCalledTimes(1);
    });

    it('calls increment multiple times on multiple taps', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('counter-pressable'));
      fireEvent.press(getByTestId('counter-pressable'));
      fireEvent.press(getByTestId('counter-pressable'));
      expect(mockIncrement).toHaveBeenCalledTimes(3);
    });
  });

  // ── Next button visibility ─────────────────────────────────────────────────

  describe('Next button visibility', () => {
    it('shows Next button when count equals target', () => {
      setupDefaults({
        currentDhikr: makeDhikr(10, 33),
        sessionState: { count: 33, dhikrIds: [10, 20, 30], currentIndex: 0 },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-next-button')).toBeTruthy();
    });

    it('shows Next button when count exceeds target', () => {
      setupDefaults({
        currentDhikr: makeDhikr(10, 33),
        sessionState: { count: 40, dhikrIds: [10, 20, 30], currentIndex: 0 },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-next-button')).toBeTruthy();
    });

    it('does NOT show Next button when count is below target', () => {
      setupDefaults({
        currentDhikr: makeDhikr(10, 33),
        sessionState: { count: 10, dhikrIds: [10, 20, 30], currentIndex: 0 },
      });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-next-button')).toBeNull();
    });

    it('always shows Next button when target is null', () => {
      setupDefaults({
        currentDhikr: makeDhikr(30, null),
        sessionState: { count: 0, dhikrIds: [30], currentIndex: 0 },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-next-button')).toBeTruthy();
    });

    it('shows Next button with count=0 when target is null', () => {
      setupDefaults({
        currentDhikr: makeDhikr(30, null),
        sessionState: { count: 0, dhikrIds: [30], currentIndex: 0 },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-next-button')).toBeTruthy();
    });
  });

  // ── Advance to next dhikr ──────────────────────────────────────────────────

  describe('Advance to next dhikr', () => {
    it('calls advance when Next button is pressed', () => {
      setupDefaults({
        currentDhikr: makeDhikr(10, 33),
        sessionState: { count: 33, dhikrIds: [10, 20, 30], currentIndex: 0 },
      });
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('session-next-button'));
      expect(mockAdvance).toHaveBeenCalledTimes(1);
    });

    it('calls advance exactly once per Next press', () => {
      setupDefaults({
        currentDhikr: makeDhikr(10, 33),
        sessionState: { count: 33, dhikrIds: [10, 20, 30], currentIndex: 0 },
      });
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('session-next-button'));
      fireEvent.press(getByTestId('session-next-button'));
      expect(mockAdvance).toHaveBeenCalledTimes(2);
    });
  });

  // ── Completion indicator ───────────────────────────────────────────────────

  describe('Completion indicator', () => {
    it('shows completion indicator when count equals target', () => {
      setupDefaults({
        currentDhikr: makeDhikr(10, 33),
        sessionState: { count: 33, dhikrIds: [10, 20, 30], currentIndex: 0 },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-completion-indicator')).toBeTruthy();
    });

    it('does not show completion indicator when count is below target', () => {
      setupDefaults({
        currentDhikr: makeDhikr(10, 33),
        sessionState: { count: 10, dhikrIds: [10, 20, 30], currentIndex: 0 },
      });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-completion-indicator')).toBeNull();
    });

    it('does not show completion indicator when target is null', () => {
      setupDefaults({
        currentDhikr: makeDhikr(30, null),
        sessionState: { count: 100, dhikrIds: [30], currentIndex: 0 },
      });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-completion-indicator')).toBeNull();
    });
  });

  // ── Session completion screen ──────────────────────────────────────────────

  describe('Session completion screen', () => {
    it('shows the completion screen when isComplete is true', () => {
      setupDefaults({
        sessionState: { isComplete: true, dhikrIds: [10, 20, 30] },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-complete-view')).toBeTruthy();
    });

    it('shows the completion title when isComplete is true', () => {
      setupDefaults({
        sessionState: { isComplete: true, dhikrIds: [10, 20, 30] },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-complete-title')).toBeTruthy();
    });

    it('does not show the dhikr view when isComplete is true', () => {
      setupDefaults({
        sessionState: { isComplete: true, dhikrIds: [10, 20, 30] },
      });
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('session-dhikr-view')).toBeNull();
    });

    it('shows the Done button on the completion screen', () => {
      setupDefaults({
        sessionState: { isComplete: true, dhikrIds: [10, 20, 30] },
      });
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-done-button')).toBeTruthy();
    });

    it('calls exitSession and navigates back when Done is pressed', () => {
      setupDefaults({
        sessionState: { isComplete: true, dhikrIds: [10, 20, 30] },
      });
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('session-done-button'));
      expect(mockExitSession).toHaveBeenCalledTimes(1);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  // ── Exit / back button ─────────────────────────────────────────────────────

  describe('Exit button', () => {
    it('renders the exit button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('session-exit-button')).toBeTruthy();
    });

    it('shows an Alert confirmation when exit button is pressed', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('session-exit-button'));
      expect(alertSpy).toHaveBeenCalledWith(
        'Exit Session',
        expect.any(String),
        expect.any(Array),
      );
    });

    it('calls exitSession and navigates back when exit is confirmed', () => {
      jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
        // Simulate pressing the "Exit" (destructive) button
        const exitBtn = (buttons as Array<{ text: string; onPress?: () => void }>).find(
          (b) => b.text === 'Exit',
        );
        exitBtn?.onPress?.();
      });

      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('session-exit-button'));

      expect(mockExitSession).toHaveBeenCalledTimes(1);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('does NOT call exitSession when exit is cancelled', () => {
      jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
        // Simulate pressing "Cancel"
        const cancelBtn = (buttons as Array<{ text: string; onPress?: () => void }>).find(
          (b) => b.text === 'Cancel',
        );
        cancelBtn?.onPress?.();
      });

      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('session-exit-button'));

      expect(mockExitSession).not.toHaveBeenCalled();
      expect(mockBack).not.toHaveBeenCalled();
    });
  });
});
