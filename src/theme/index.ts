/**
 * Theme barrel export.
 *
 * Import all design tokens from this single entry point:
 *   import { colors, spacing, radii, fontFamilies, arabicTextStyle } from '@/theme';
 */

export { colors } from './colors';
export type { ColorToken } from './colors';

export {
  fontFamilies,
  arabicFontSizes,
  uiFontSizes,
  arabicLineHeights,
  uiLineHeights,
  arabicTextStyle,
  uiTextStyle,
} from './typography';

export { spacing, radii } from './spacing';
export type { SpacingToken, RadiusToken } from './spacing';
