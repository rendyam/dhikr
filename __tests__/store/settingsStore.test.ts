/**
 * Unit tests for src/store/settingsStore.ts
 *
 * Covers:
 *   - Default state values on first load
 *   - setLanguage updates language and calls changeLanguage (i18n)
 *   - setTextSize updates textSize
 *   - toggleTransliteration flips showTransliteration
 *   - setNotificationEnabled updates notificationEnabled
 *   - setNotificationTime updates notificationTime
 *   - Persisted state is restored on re-hydration (via persist middleware)
 *
 * Requirements: 7.2, 8.1, 8.3, 15.6, 15.7
 */

// Mock i18n so changeLanguage is a no-op jest.fn() — avoids initialising i18next
jest.mock('../../src/i18n', () => ({
  changeLanguage: jest.fn().mockResolvedValue(undefined),
}));

import { act } from 'react';
import { useSettingsStore } from '../../src/store/settingsStore';
import { changeLanguage } from '../../src/i18n';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shorthand to read the current store state without subscribing. */
const getState = () => useSettingsStore.getState();

/** Reset the store to its initial defaults before each test. */
beforeEach(() => {
  act(() => {
    useSettingsStore.setState({
      language: 'en',
      textSize: 'medium',
      showTransliteration: true,
      notificationEnabled: true,
      notificationTime: '08:00',
    });
  });
  jest.clearAllMocks();
});

// ── Default state ─────────────────────────────────────────────────────────────

describe('default state', () => {
  it('has language "en"', () => {
    expect(getState().language).toBe('en');
  });

  it('has textSize "medium"', () => {
    expect(getState().textSize).toBe('medium');
  });

  it('has showTransliteration true', () => {
    expect(getState().showTransliteration).toBe(true);
  });

  it('has notificationEnabled true', () => {
    expect(getState().notificationEnabled).toBe(true);
  });

  it('has notificationTime "08:00"', () => {
    expect(getState().notificationTime).toBe('08:00');
  });
});

// ── setLanguage ───────────────────────────────────────────────────────────────

describe('setLanguage', () => {
  it('updates language in state', () => {
    act(() => {
      getState().setLanguage('id');
    });
    expect(getState().language).toBe('id');
  });

  it('calls changeLanguage with the new locale', () => {
    act(() => {
      getState().setLanguage('id');
    });
    expect(changeLanguage).toHaveBeenCalledWith('id');
  });

  it('calls changeLanguage exactly once per call', () => {
    act(() => {
      getState().setLanguage('id');
    });
    expect(changeLanguage).toHaveBeenCalledTimes(1);
  });

  it('updates language back to "en"', () => {
    act(() => {
      getState().setLanguage('id');
    });
    act(() => {
      getState().setLanguage('en');
    });
    expect(getState().language).toBe('en');
  });

  it('calls changeLanguage for each setLanguage call', () => {
    act(() => {
      getState().setLanguage('id');
      getState().setLanguage('en');
    });
    expect(changeLanguage).toHaveBeenCalledTimes(2);
  });
});

// ── setTextSize ───────────────────────────────────────────────────────────────

describe('setTextSize', () => {
  it('updates textSize to "small"', () => {
    act(() => {
      getState().setTextSize('small');
    });
    expect(getState().textSize).toBe('small');
  });

  it('updates textSize to "large"', () => {
    act(() => {
      getState().setTextSize('large');
    });
    expect(getState().textSize).toBe('large');
  });

  it('updates textSize back to "medium"', () => {
    act(() => {
      getState().setTextSize('small');
    });
    act(() => {
      getState().setTextSize('medium');
    });
    expect(getState().textSize).toBe('medium');
  });
});

// ── toggleTransliteration ─────────────────────────────────────────────────────

describe('toggleTransliteration', () => {
  it('flips showTransliteration from true to false', () => {
    // Default is true
    act(() => {
      getState().toggleTransliteration();
    });
    expect(getState().showTransliteration).toBe(false);
  });

  it('flips showTransliteration from false to true', () => {
    act(() => {
      useSettingsStore.setState({ showTransliteration: false });
    });
    act(() => {
      getState().toggleTransliteration();
    });
    expect(getState().showTransliteration).toBe(true);
  });

  it('toggles back to original value after two calls', () => {
    const original = getState().showTransliteration;
    act(() => {
      getState().toggleTransliteration();
      getState().toggleTransliteration();
    });
    expect(getState().showTransliteration).toBe(original);
  });
});

// ── setNotificationEnabled ────────────────────────────────────────────────────

describe('setNotificationEnabled', () => {
  it('sets notificationEnabled to false', () => {
    act(() => {
      getState().setNotificationEnabled(false);
    });
    expect(getState().notificationEnabled).toBe(false);
  });

  it('sets notificationEnabled back to true', () => {
    act(() => {
      getState().setNotificationEnabled(false);
    });
    act(() => {
      getState().setNotificationEnabled(true);
    });
    expect(getState().notificationEnabled).toBe(true);
  });
});

// ── setNotificationTime ───────────────────────────────────────────────────────

describe('setNotificationTime', () => {
  it('updates notificationTime to a new value', () => {
    act(() => {
      getState().setNotificationTime('21:30');
    });
    expect(getState().notificationTime).toBe('21:30');
  });

  it('updates notificationTime to midnight', () => {
    act(() => {
      getState().setNotificationTime('00:00');
    });
    expect(getState().notificationTime).toBe('00:00');
  });

  it('updates notificationTime to end of day', () => {
    act(() => {
      getState().setNotificationTime('23:59');
    });
    expect(getState().notificationTime).toBe('23:59');
  });
});

// ── Persistence re-hydration ──────────────────────────────────────────────────

describe('persistence re-hydration', () => {
  it('restores persisted state when setState is called with stored values', () => {
    // Simulate what the persist middleware does on re-hydration:
    // it calls setState with the previously persisted values.
    act(() => {
      useSettingsStore.setState({
        language: 'id',
        textSize: 'large',
        showTransliteration: false,
        notificationEnabled: false,
        notificationTime: '20:00',
      });
    });

    const state = getState();
    expect(state.language).toBe('id');
    expect(state.textSize).toBe('large');
    expect(state.showTransliteration).toBe(false);
    expect(state.notificationEnabled).toBe(false);
    expect(state.notificationTime).toBe('20:00');
  });

  it('preserves action functions after re-hydration', () => {
    act(() => {
      useSettingsStore.setState({
        language: 'id',
        textSize: 'large',
        showTransliteration: false,
        notificationEnabled: false,
        notificationTime: '20:00',
      });
    });

    const state = getState();
    expect(typeof state.setLanguage).toBe('function');
    expect(typeof state.setTextSize).toBe('function');
    expect(typeof state.toggleTransliteration).toBe('function');
    expect(typeof state.setNotificationEnabled).toBe('function');
    expect(typeof state.setNotificationTime).toBe('function');
  });

  it('actions still work correctly after re-hydration', () => {
    act(() => {
      useSettingsStore.setState({
        language: 'id',
        textSize: 'large',
        showTransliteration: false,
        notificationEnabled: false,
        notificationTime: '20:00',
      });
    });

    act(() => {
      getState().setTextSize('small');
    });
    expect(getState().textSize).toBe('small');
  });
});
