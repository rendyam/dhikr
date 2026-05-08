/**
 * Semantic color tokens for the Muslim Dhikr App.
 *
 * All colors are defined here and nowhere else — no hardcoded hex values
 * in component files. Import from `@/theme` (re-exported via index.ts).
 *
 * Requirements: 3.1, 8.1, 8.2, 12.3
 */

export const colors = {
  // ── Brand / Primary ──────────────────────────────────────────────────────
  /** Main brand green — used for active states, CTAs, and accent elements */
  primary: '#1B6B3A',
  /** Lighter tint of primary — used for pressed states and subtle highlights */
  primaryLight: '#2E8B57',
  /** Very light tint — used for selected backgrounds */
  primarySubtle: '#E8F5EE',

  // ── Backgrounds ──────────────────────────────────────────────────────────
  /** Main app background */
  background: '#FFFFFF',
  /** Slightly off-white surface for cards, modals, and sheets */
  surface: '#F8F9FA',
  /** Elevated surface (e.g. bottom sheets, popovers) */
  surfaceElevated: '#FFFFFF',

  // ── Text ─────────────────────────────────────────────────────────────────
  /** Primary body text */
  textPrimary: '#1A1A1A',
  /** Secondary / supporting text */
  textSecondary: '#6B7280',
  /** Disabled / placeholder text */
  textDisabled: '#9CA3AF',
  /** Text on dark/primary-colored backgrounds */
  textInverse: '#FFFFFF',

  // ── Border ───────────────────────────────────────────────────────────────
  /** Default border for cards and inputs */
  border: '#E5E7EB',
  /** Stronger border for focused inputs */
  borderFocus: '#1B6B3A',

  // ── Semantic States ───────────────────────────────────────────────────────
  /** Success — used for Sahih badge and completion indicators */
  success: '#16A34A',
  successSubtle: '#DCFCE7',
  /** Warning — used for Hasan badge */
  warning: '#D97706',
  warningSubtle: '#FEF3C7',
  /** Error — used for form validation and error states */
  error: '#DC2626',
  errorSubtle: '#FEE2E2',

  // ── Streak / Gamification ─────────────────────────────────────────────────
  /** Flame color for streak widget */
  streak: '#F97316',
  /** Checked-in state indicator */
  checkedIn: '#16A34A',

  // ── Utility ───────────────────────────────────────────────────────────────
  /** Fully transparent */
  transparent: 'transparent',
  /** Overlay backdrop for modals */
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;
