/**
 * Spacing scale for the Muslim Dhikr App.
 *
 * All margin, padding, gap, and border-radius values should be drawn
 * from this scale to keep the layout consistent across screens.
 *
 * Usage:
 *   import { spacing } from '@/theme';
 *   paddingHorizontal: spacing[4]   // 16
 *   marginBottom: spacing[2]        // 8
 *
 * Requirements: 3.1, 8.1, 12.3
 */

export const spacing = {
  /** 4px — tight internal padding, icon gaps */
  1: 4,
  /** 8px — small gaps between related elements */
  2: 8,
  /** 12px — compact padding inside cards */
  3: 12,
  /** 16px — standard screen horizontal padding */
  4: 16,
  /** 24px — section spacing */
  6: 24,
  /** 32px — large section gaps */
  8: 32,
  /** 48px — hero / top-of-screen spacing */
  12: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

/**
 * Border radius scale — used for cards, badges, and buttons.
 */
export const radii = {
  /** 4px — subtle rounding for small elements (badges, chips) */
  sm: 4,
  /** 8px — standard card rounding */
  md: 8,
  /** 12px — larger cards and bottom sheets */
  lg: 12,
  /** 24px — pill-shaped buttons and tags */
  pill: 24,
  /** 9999px — fully circular (avatar, counter ring) */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
