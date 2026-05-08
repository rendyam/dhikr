/**
 * Smoke test to verify the testing setup is working correctly.
 * Tests that core dependencies are importable and functional.
 */

describe('Dependency setup verification', () => {
  it('fast-check is importable', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fc = require('fast-check');
    expect(fc).toBeDefined();
    expect(typeof fc.property).toBe('function');
  });

  it('zustand is importable', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { create } = require('zustand');
    expect(typeof create).toBe('function');
  });

  it('i18next is importable', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const i18next = require('i18next');
    expect(i18next).toBeDefined();
  });

  it('react-i18next is importable', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTranslation } = require('react-i18next');
    expect(typeof useTranslation).toBe('function');
  });
});
